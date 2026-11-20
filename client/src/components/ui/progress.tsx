type ProgressProps = {
  value: number;
  label: string;
};

export function Progress({ value, label }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const shown = Math.round(clamped);
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={shown}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-standard motion-reduce:transition-none"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

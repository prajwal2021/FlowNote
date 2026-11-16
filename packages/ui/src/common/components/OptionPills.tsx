interface OptionPillsProps<T extends string> {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function OptionPills<T extends string>({ options, value, onChange, label }: OptionPillsProps<T>) {
  return (
    <fieldset className="m-0 inline-flex min-w-0 rounded-xl border border-border bg-secondary p-1">
      <legend className="sr-only">{label}</legend>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
            value === option.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </fieldset>
  );
}

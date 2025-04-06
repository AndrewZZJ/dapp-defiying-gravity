interface InputFieldProps {
    label: string;
    placeholder: string;
    value?: string;
    onChange?: (value: string) => void;
  }
  
  export const InputField: React.FC<InputFieldProps> = ({
    label,
    placeholder,
    value,
    onChange,
  }) => {
    return (
      <div className="w-full">
        <label className="leading-snug text-stone-900">{label}</label>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className="overflow-hidden flex-1 shrink self-stretch px-4 py-2 mt-1 w-full leading-none bg-white rounded-lg border border-solid basis-0 border-zinc-300 min-w-60 text-zinc-400"
        />
      </div>
    );
  };
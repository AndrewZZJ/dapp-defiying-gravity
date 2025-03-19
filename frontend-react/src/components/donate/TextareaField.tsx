interface TextareaFieldProps {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
}

export const TextareaField: React.FC<TextareaFieldProps> = ({
  label,
  value,
  onChange,
}) => {
  return (
    <div className="w-full leading-snug">
      <label className="text-stone-900">{label}</label>
      <div className="flex overflow-hidden relative gap-1 items-start px-4 py-3 mt-2 w-full bg-white rounded-lg border border-solid border-zinc-300 min-h-20 min-w-60 text-zinc-400">
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="z-0 flex-1 shrink basis-0 resize-none outline-none"
        />
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/e7030f78278d7c5e1f552a2fc04e70b5790a8dfc?placeholderIfAbsent=true&apiKey=a1e026a667a24fc2bd5beacbd7180351"
          alt=""
          className="object-contain absolute bottom-1.5 z-0 shrink-0 aspect-square h-[7px] right-[5px] w-[7px]"
        />
      </div>
    </div>
  );
};

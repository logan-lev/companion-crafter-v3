interface Props {
  title?: string;
  label: string;
  items: string[];
  emptyLabel?: string;
  onChange: (items: string[]) => void;
  addLabel?: string;
  framed?: boolean;
}

export default function StringListEditor({
  title,
  label,
  items,
  emptyLabel = 'No items yet.',
  onChange,
  addLabel = '+ Add Item',
  framed = true,
}: Props) {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  const addItem = () => {
    onChange([...items, 'New entry']);
  };

  const content = (
    <>
      {title && <div className="section-title">{title}</div>}
      <div className="field-label mb-2">{label}</div>
      {items.length === 0 ? (
        <div className="mb-3 text-sm italic text-[var(--color-text-dim)]">{emptyLabel}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-sm font-bold text-[var(--color-accent)]">{index + 1}.</span>
              <input
                value={item}
                onChange={(e) => updateItem(index, e.target.value)}
                className="field-input flex-1 text-sm"
                placeholder={`${label} ${index + 1}`}
              />
              <button onClick={() => removeItem(index)} className="text-red-500 text-xs px-2">✕</button>
            </div>
          ))}
        </div>
      )}
      <button
        onClick={addItem}
        className="mt-3 text-xs text-[var(--color-accent)] border border-[var(--color-accent)] px-2 py-1 hover:bg-[var(--color-hover)]"
      >
        {addLabel}
      </button>
    </>
  );

  return framed ? <div className="section-box">{content}</div> : <div>{content}</div>;
}

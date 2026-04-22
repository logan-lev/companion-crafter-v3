import { useMemo, useState } from 'react';
import { LANGUAGES } from '../data/srd';

interface Props {
  title?: string;
  items: string[];
  onChange: (items: string[]) => void;
  emptyLabel?: string;
}

export default function LanguageListEditor({ title, items, onChange, emptyLabel = 'No languages recorded yet.' }: Props) {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [customLanguage, setCustomLanguage] = useState('');
  const availableLanguages = useMemo(
    () => LANGUAGES.filter(language => !items.includes(language)),
    [items],
  );

  const addSelectedLanguage = () => {
    if (!selectedLanguage) return;
    onChange([...items, selectedLanguage]);
    setSelectedLanguage('');
  };

  const addCustomLanguage = () => {
    const value = customLanguage.trim();
    if (!value) return;
    onChange([...items, value]);
    setCustomLanguage('');
  };

  return (
    <div className="section-box">
      {title && <div className="section-title">{title}</div>}
      {items.length === 0 ? (
        <div className="mb-3 text-sm italic text-[#7a6020]">{emptyLabel}</div>
      ) : (
        <div className="mb-3 flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={`${item}-${index}`} className="flex items-center gap-2">
              <span className="w-7 shrink-0 text-sm font-bold text-[#b8962e]">{index + 1}.</span>
              <div className="field-input flex-1 text-sm">{item}</div>
              <button onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))} className="text-red-500 text-xs px-2">✕</button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <select
          value={selectedLanguage}
          onChange={(e) => setSelectedLanguage(e.target.value)}
          className="field-input select"
        >
          <option value="">Choose a language</option>
          {availableLanguages.map(language => (
            <option key={language} value={language}>{language}</option>
          ))}
        </select>
        <button onClick={addSelectedLanguage} className="save-btn whitespace-nowrap">+ Add Language</button>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
        <input
          value={customLanguage}
          onChange={(e) => setCustomLanguage(e.target.value)}
          className="field-input"
          placeholder="Add a custom language"
        />
        <button onClick={addCustomLanguage} className="tab-btn whitespace-nowrap">+ Add Custom</button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Character } from '../types/character';
import { RACES, ALIGNMENTS, BACKGROUNDS, calcMod } from '../data/srd';
import { recalcProfBonus } from '../utils/storage';
import { canCharacterCastSpells, getListItems } from '../utils/character-sheet';
import AbilityScores from './AbilityScores';
import SavingThrows from './SavingThrows';
import Skills from './Skills';
import CombatStats from './CombatStats';
import SpellSheet from './SpellSheet';
import Inventory from './Inventory';
import FeaturesTraits from './FeaturesTraits';
import Backstory from './Backstory';
import StringListEditor from './StringListEditor';
import LanguageListEditor from './LanguageListEditor';

interface Props {
  character: Character;
  onChange: (c: Character) => void;
  onSave: () => void;
  onDelete: () => void;
}

type Tab = 'main' | 'combat' | 'spells' | 'inventory' | 'features' | 'backstory';

function ListPanel({ title, items, emptyLabel }: { title: string; items: string[]; emptyLabel: string }) {
  return (
    <div>
      <div className="section-title">{title}</div>
      {items.length === 0 ? (
        <div className="text-sm italic text-[#7a6020]">{emptyLabel}</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <div key={`${title}-${index}`} className="rounded border border-[#2a1f00] px-3 py-2 text-sm leading-6 text-[#e8cf88]">
              <span className="mr-2 text-[#b8962e]">{index + 1}.</span>
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CharacterSheet({ character, onChange, onSave, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('main');
  const [isEditing, setIsEditing] = useState(false);
  const canCastSpells = canCharacterCastSpells(character);
  const tabs: { id: Tab; label: string }[] = [
    { id: 'main', label: 'Core' },
    { id: 'combat', label: 'Combat' },
    ...(canCastSpells ? [{ id: 'spells' as Tab, label: 'Spells' }] : []),
    { id: 'inventory', label: 'Inventory' },
    { id: 'features', label: 'Features' },
    { id: 'backstory', label: 'Backstory' },
  ];

  const up = (patch: Partial<Character>) => {
    if (!isEditing) return;
    const updated = { ...character, ...patch };
    onChange('classAndLevel' in patch ? recalcProfBonus(updated) : updated);
  };

  const dexMod = calcMod(character.abilityScores.dex);
  const lockClass = isEditing ? '' : 'pointer-events-none opacity-90';
  const proficiencyItems = getListItems(character.otherProficiencies);
  const languageItems = character.languages ?? [];
  const featureItems = character.featuresAndTraits
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean);
  const setProficiencyItems = (items: string[]) => up({ otherProficiencies: items.filter(Boolean).join(', ') });
  const setLanguageItems = (items: string[]) => up({ languages: items.filter(Boolean) });
  const setFeatureItems = (items: string[]) => up({ featuresAndTraits: items.filter(Boolean).join('\n\n') });

  return (
    <div className="flex flex-col gap-6">
      <div className="section-box">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm leading-6 text-[#c8a84b]">
            {isEditing
              ? 'Edit mode is on. Make your changes, then save when you are done.'
              : 'This sheet is in view mode. Click Edit Sheet to make changes.'}
          </div>
          <div className="flex gap-3">
            {isEditing ? (
              <button className="tab-btn" onClick={() => setIsEditing(false)}>Stop Editing</button>
            ) : (
              <button className="save-btn" onClick={() => setIsEditing(true)}>Edit Sheet</button>
            )}
          </div>
        </div>
      </div>

      {/* Header / Basic Info */}
      <div className="section-box">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="col-span-2 lg:col-span-2">
              <label className="field-label">Character Name</label>
              <input value={character.name}
                onChange={(e) => up({ name: e.target.value })}
                disabled={!isEditing}
                className="field-input text-2xl font-bold"
                placeholder="Character Name" />
            </div>
            <div>
              <label className="field-label">Class & Level</label>
              <input value={character.classAndLevel}
                onChange={(e) => up({ classAndLevel: e.target.value })}
                disabled={!isEditing}
                className="field-input" placeholder="Fighter 5" />
            </div>
            <div>
              <label className="field-label">Background</label>
              <select value={character.background}
                onChange={(e) => up({ background: e.target.value })}
                disabled={!isEditing}
                className="field-input select">
                <option value="">—</option>
                {BACKGROUNDS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Player Name</label>
              <input value={character.playerName}
                onChange={(e) => up({ playerName: e.target.value })}
                disabled={!isEditing}
                className="field-input" />
            </div>
            <div>
              <label className="field-label">Race</label>
              <select value={character.race}
                onChange={(e) => up({ race: e.target.value })}
                disabled={!isEditing}
                className="field-input select">
                <option value="">—</option>
                {RACES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Alignment</label>
              <select value={character.alignment}
                onChange={(e) => up({ alignment: e.target.value })}
                disabled={!isEditing}
                className="field-input select">
                <option value="">—</option>
                {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="field-label">Leveling</label>
              <div className="field-input flex items-center">Milestone</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 lg:grid-cols-6 xl:grid-cols-3">
            <div className="stat-box">
              <div className="text-base font-bold">{character.proficiencyBonus >= 0 ? '+' : ''}{character.proficiencyBonus}</div>
              <div className="field-label">Prof Bonus</div>
            </div>
            <div className={`stat-box ${isEditing ? 'cursor-pointer' : ''}`} onClick={() => isEditing && up({ inspiration: !character.inspiration })}>
              <div className="text-base font-bold">{character.inspiration ? '★' : '☆'}</div>
              <div className="field-label">Inspiration</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{character.armorClass}</div>
              <div className="field-label">Armor Class</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{dexMod >= 0 ? '+' : ''}{dexMod}</div>
              <div className="field-label">Initiative</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{character.speed} ft</div>
              <div className="field-label">Speed</div>
            </div>
            <div className="stat-box">
              <div className="text-base font-bold">{character.currentHp}/{character.maxHp}</div>
              <div className="field-label">HP</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-0">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`tab-btn ${tab === t.id ? 'active' : ''}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'main' && (
        <div className="flex flex-col gap-4">
          <div className={lockClass}>
            <AbilityScores character={character} onChange={onChange} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_minmax(0,1fr)]">
            <div className={`flex flex-col gap-4 ${lockClass}`}>
              <SavingThrows character={character} onChange={onChange} />
              <Skills character={character} onChange={onChange} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="section-box flex items-center justify-between">
                <span className="field-label">Passive Wisdom (Perception)</span>
                <span className="font-bold text-lg">
                  {10 + calcMod(character.abilityScores.wis) + (character.skillProfs['Perception'] ? character.proficiencyBonus : 0)}
                </span>
              </div>

              <div>
                {isEditing ? (
                  <StringListEditor
                    title="Other Proficiencies"
                    label="Proficiencies"
                    items={proficiencyItems}
                    emptyLabel="No proficiencies recorded yet."
                    onChange={setProficiencyItems}
                    addLabel="+ Add Proficiency"
                  />
                ) : (
                  <ListPanel
                    title="Other Proficiencies"
                    items={proficiencyItems}
                    emptyLabel="No proficiencies recorded yet."
                  />
                )}
              </div>

              <div>
                {isEditing ? (
                  <LanguageListEditor
                    title="Languages"
                    items={languageItems}
                    onChange={setLanguageItems}
                  />
                ) : (
                  <ListPanel
                    title="Languages"
                    items={languageItems}
                    emptyLabel="No languages recorded yet."
                  />
                )}
              </div>

              <div>
                {isEditing ? (
                  <StringListEditor
                    title="Features & Traits"
                    label="Features, traits, and feats"
                    items={featureItems}
                    emptyLabel="No features or traits recorded yet."
                    onChange={setFeatureItems}
                    addLabel="+ Add Feature or Trait"
                  />
                ) : (
                  <ListPanel
                    title="Features & Traits"
                    items={featureItems}
                    emptyLabel="No features or traits recorded yet."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'combat' && <div className={lockClass}><CombatStats character={character} onChange={onChange} /></div>}
      {tab === 'spells' && canCastSpells && <div className={lockClass}><SpellSheet character={character} onChange={onChange} /></div>}
      {tab === 'inventory' && <div className={lockClass}><Inventory character={character} onChange={onChange} /></div>}
      {tab === 'features' && <div className={lockClass}><FeaturesTraits character={character} onChange={onChange} editable={isEditing} /></div>}
      {tab === 'backstory' && <div className={lockClass}><Backstory character={character} onChange={onChange} /></div>}

      {/* Save / Delete */}
      <div className="flex gap-3 justify-end pt-2 border-t border-[#2a1f00]">
        <button className="delete-btn" onClick={onDelete}>Delete Character</button>
        {isEditing && (
          <button className="save-btn" onClick={() => {
            onSave();
            setIsEditing(false);
          }}>
            Save Character
          </button>
        )}
      </div>
    </div>
  );
}
